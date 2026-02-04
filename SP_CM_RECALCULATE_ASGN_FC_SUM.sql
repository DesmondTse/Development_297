CREATE OR ALTER PROCEDURE [Census].[SP_CM_RECALCULATE_ASGN_FC_SUM]
(
    @pBaseJson        nvarchar(max),
    @pAsgnUID         bigint,
    @pResultJson      nvarchar(max) OUTPUT,
    @pErrCode         int = 0 OUTPUT,
    @pErrMsg          nvarchar(200) OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @actualNCD int, @actualNCN int;

    -- 重新統計：只要是 F 紀錄，按日期去重
    -- 日間 (06:00 - 17:59)
    SELECT @actualNCD = COUNT(DISTINCT CAST(STRT_DT AS DATE))
    FROM [Census].[CM_INTV_LOG] WITH (NOLOCK)
    WHERE ASGN_UID = @pAsgnUID 
      AND INTV_MDE = 'F' 
      AND (DATEPART(HOUR, STRT_DT) >= 6 AND DATEPART(HOUR, STRT_DT) < 18);

    -- 夜間 (18:00 - 05:59)
    SELECT @actualNCN = COUNT(DISTINCT CAST(STRT_DT AS DATE))
    FROM [Census].[CM_INTV_LOG] WITH (NOLOCK)
    WHERE ASGN_UID = @pAsgnUID 
      AND INTV_MDE = 'F' 
      AND (DATEPART(HOUR, STRT_DT) >= 18 OR DATEPART(HOUR, STRT_DT) < 6);

    -- 準備 JSON 調用標準更新接口
    DECLARE @updateMainJson nvarchar(max) = (
        SELECT @pAsgnUID AS ASGN_UID, 
               ISNULL(@actualNCD, 0) AS NCD_FC_SUM, 
               ISNULL(@actualNCN, 0) AS NCN_FC_SUM, 
               'U' AS RecordState 
        FOR JSON PATH
    );

    -- 統一調用你現有的主表更新 SP
    EXEC [Census].[SP_CM_SET_ASGN_MAIN] 
        @pBaseJson = @pBaseJson, 
        @pJson = @updateMainJson, 
        @pResultJson = @pResultJson OUTPUT, 
        @pErrCode = @pErrCode OUTPUT, 
        @pErrMsg = @pErrMsg OUTPUT;
END