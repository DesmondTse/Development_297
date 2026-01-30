ALTER               PROCEDURE [Census].[SP_CM_SET_INTV_LOG]
    (
        @pBaseJson        nvarchar(max),
        @pJson            nvarchar(max),
        @pResultJson      nvarchar(max) OUTPUT,
        @pErrCode         int = 0 OUTPUT,
        @pErrMsg          nvarchar(200) OUTPUT
    )
AS
BEGIN
    SET NOCOUNT ON
    SET XACT_ABORT ON
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	DECLARE @sRTN_Result TABLE(
		[INTV_LOG_UID] bigint
    )

	CREATE TABLE #sResultTable_SetCM_INTV_LOG(
        [INTV_LOG_UID] bigint
    )

    DECLARE
        @sBeginTranCount int = 0,
        @sNow            datetime2 = DATEADD(HOUR, 8, SYSUTCDATETIME()),
		@sTableName      varchar(50) = 'CM_INTV_LOG',
        @sIsReturnResult char(1),
        @sTestMode	     int = 0, -- 0: Normal(Non-Test), 1: UnitTest, 2: Scenario Test
        @sNonceToken     varchar(64),
		@sUserID		 varchar(20),
		@sStaffPositionUID	int,
		@sAuthByLst      nvarchar(max),
		@sAuthByGUID     uniqueidentifier,
		@sSystemCode    varchar(5)

    SET @sBeginTranCount = @@TRANCOUNT
    SELECT @pErrCode = 0 , @pErrMsg = ''

    SELECT *
    INTO   #BaseJsonDataTable
    FROM
        Census.FN_GetBaseJson(@pBaseJson)

    SELECT *
    INTO #sDataSet_SetCM_INTV_LOG
    FROM
		OPENJSON(@pJson)
    WITH (
        [INTV_LOG_UID] bigint '$.INTV_LOG_UID', 
		[GUID] uniqueidentifier '$.GUID', 
		[ASGN_UID] bigint '$.ASGN_UID', 
		[POSN_UID] int '$.POSN_UID', 
		[STF_UID] int '$.STF_UID', 
		[POSN_CD] varchar(20) '$.POSN_CD', 
		[POSN_NAME_ENG] varchar(100) '$.POSN_NAME_ENG', 
		[POSN_NAME_CHI] nvarchar(100) '$.POSN_NAME_CHI', 
		[STF_NO] varchar(20) '$.STF_NO', 
		[STF_NAME_ENG] varchar(50) '$.STF_NAME_ENG', 
		[STF_NAME_CHI] nvarchar(20) '$.STF_NAME_CHI', 
		[STRT_DT] datetime '$.STRT_DT', 
		[END_DT] datetime '$.END_DT', 
		[STRT_DT_SYS] datetime '$.STRT_DT_SYS', 
		[END_DT_SYS] datetime '$.END_DT_SYS', 
		[HH_CONT_UID] bigint '$.HH_CONT_UID', 
		[ESTB_CONT_UID] bigint '$.ESTB_CONT_UID', 
		[RFS_INTVE_INFO] varchar(1) '$.RFS_INTVE_INFO', 
		[SUBM_DT] datetime '$.SUBM_DT', 
		[INTV_SESS] varchar(2) '$.INTV_SESS', 
		[INTV_MDE] varchar(2) '$.INTV_MDE', 
		[FU_IND] varchar(1) '$.FU_IND', 
		[Q_DATA_VER_NO] int '$.Q_DATA_VER_NO', 
		[TI_FAIL_RSN_CD] varchar(4) '$.TI_FAIL_RSN_CD', 
		[VST_RSLT_CD] varchar(4) '$.VST_RSLT_CD', 
		[VST_RSLT_RMKS] varchar(500) '$.VST_RSLT_RMKS', 
		[ENUM_RSLT_CD] varchar(4) '$.ENUM_RSLT_CD', 
		[ENUM_RSLT_RMKS] nvarchar(500) '$.ENUM_RSLT_RMKS', 
		[INTV_RMKS] nvarchar(1000) '$.INTV_RMKS', 
		[CRE_DT] datetime '$.CRE_DT', 
		[CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', 
		[CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', 
		[CRE_SYS_CD] varchar(5) '$.CRE_SYS_CD', 
		[UPD_DT] datetime '$.UPD_DT', 
		[UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', 
		[UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', 
		[UPD_SYS_CD] varchar(5) '$.UPD_SYS_CD', 
		[VER_NO] int '$.VER_NO', 
		[INTV_STS] varchar(1) '$.INTV_STS', 
		RecordState varchar(1)
    )

    BEGIN TRY
        IF @sBeginTranCount = 0 BEGIN
            BEGIN TRAN
        END

		UPDATE #sDataSet_SetCM_INTV_LOG SET
		[STRT_DT_SYS] = CASE WHEN [STRT_DT] IS NULL THEN NULL ELSE @sNow END, 
		[END_DT_SYS] = CASE WHEN [END_DT] IS NULL THEN NULL ELSE @sNow END
		
        IF EXISTS(SELECT 1 FROM #BaseJsonDataTable b) BEGIN
            SELECT TOP 1 @sIsReturnResult = ISNULL(b.IsReturnResult, 'N'), @sTestMode = ISNULL(b.TestMode, 0), @sUserID = b.UserID, @sStaffPositionUID = ISNULL(b.StaffPositionUID, 0),@sSystemCode = ISNULL(b.SystemCode, '')--, @sNonceToken = ISNULL(b.NonceToken, '') 
			FROM #BaseJsonDataTable b
        END

        IF EXISTS (SELECT 1 FROM #sDataSet_SetCM_INTV_LOG WHERE RecordState = 'I') BEGIN
            INSERT INTO [Census].[CM_INTV_LOG]([GUID], 
				[ASGN_UID], 
				[POSN_UID], 
				[STF_UID], 
				[POSN_CD], 
				[POSN_NAME_ENG], 
				[POSN_NAME_CHI], 
				[STF_NO], 
				[STF_NAME_ENG], 
				[STF_NAME_CHI], 
				[STRT_DT], 
				[END_DT], 
				[STRT_DT_SYS], 
				[END_DT_SYS], 
				[HH_CONT_UID], 
				[ESTB_CONT_UID], 
				[RFS_INTVE_INFO], 
				[SUBM_DT], 
				[INTV_SESS], 
				[INTV_MDE], 
				[FU_IND], 
				[Q_DATA_VER_NO], 
				[TI_FAIL_RSN_CD], 
				[VST_RSLT_CD], 
				[VST_RSLT_RMKS], 
				[ENUM_RSLT_CD], 
				[ENUM_RSLT_RMKS], 
				[INTV_RMKS], 
				[CRE_DT], 
				[CRE_BY_USR_ID], 
				[CRE_BY_STF_POSN_UID], 
				[CRE_SYS_CD], 
				[UPD_DT], 
				[UPD_BY_USR_ID], 
				[UPD_BY_STF_POSN_UID], 
				[UPD_SYS_CD], 
				[VER_NO],
				[INTV_STS])
			    OUTPUT INSERTED.INTV_LOG_UID
			    INTO #sResultTable_SetCM_INTV_LOG
            SELECT 
				ISNULL(tmp.[GUID], newID()), 
				tmp.[ASGN_UID], 
				tmp.[POSN_UID], 
				tmp.[STF_UID], 
				tmp.[POSN_CD], 
				tmp.[POSN_NAME_ENG], 
				tmp.[POSN_NAME_CHI], 
				tmp.[STF_NO], 
				tmp.[STF_NAME_ENG], 
				tmp.[STF_NAME_CHI], 
				tmp.[STRT_DT], 
				tmp.[END_DT], 
				CASE WHEN tmp.[STRT_DT] IS NULL THEN NULL ELSE getDate() END, --[STRT_DT_SYS]
				CASE WHEN tmp.[END_DT] IS NULL THEN NULL ELSE getDate() END, --[END_DT_SYS]
				tmp.[HH_CONT_UID], 
				tmp.[ESTB_CONT_UID], 
				tmp.[RFS_INTVE_INFO], 
				tmp.[SUBM_DT], 
				tmp.[INTV_SESS], 
				tmp.[INTV_MDE], 
				tmp.[FU_IND], 
				tmp.[Q_DATA_VER_NO], 
				tmp.[TI_FAIL_RSN_CD], 
				tmp.[VST_RSLT_CD], 
				tmp.[VST_RSLT_RMKS], 
				tmp.[ENUM_RSLT_CD], 
				tmp.[ENUM_RSLT_RMKS], 
				tmp.[INTV_RMKS], 
				@sNow, 
				@sUserID, 
				@sStaffPositionUID, 
				@sSystemCode, 
				@sNow, 
				@sUserID, 
				@sStaffPositionUID, 
				@sSystemCode, 
				1,
				ISNULL(tmp.[INTV_STS], 'A')
				FROM #sDataSet_SetCM_INTV_LOG tmp
				WHERE RecordState = 'I' 
		
        END

        IF EXISTS (SELECT 1 FROM #sDataSet_SetCM_INTV_LOG WHERE RecordState = 'U') BEGIN
            UPDATE cmintvlog_ SET
				 [ASGN_UID] = ISNULL(tmp.[ASGN_UID], cmintvlog_.[ASGN_UID]), 
				 [POSN_UID] = ISNULL(tmp.[POSN_UID], cmintvlog_.[POSN_UID]), 
				 [STF_UID] = ISNULL(tmp.[STF_UID], cmintvlog_.[STF_UID]), 
				 [POSN_CD] = ISNULL(tmp.[POSN_CD], cmintvlog_.[POSN_CD]), 
				 [POSN_NAME_ENG] = ISNULL(tmp.[POSN_NAME_ENG], cmintvlog_.[POSN_NAME_ENG]), 
				 [POSN_NAME_CHI] = ISNULL(tmp.[POSN_NAME_CHI], cmintvlog_.[POSN_NAME_CHI]), 
				 [STF_NO] = ISNULL(tmp.[STF_NO], cmintvlog_.[STF_NO]), 
				 [STF_NAME_ENG] = ISNULL(tmp.[STF_NAME_ENG], cmintvlog_.[STF_NAME_ENG]), 
				 [STF_NAME_CHI] = ISNULL(tmp.[STF_NAME_CHI], cmintvlog_.[STF_NAME_CHI]), 
				 [STRT_DT] = ISNULL(tmp.[STRT_DT], cmintvlog_.[STRT_DT]), 
				 [END_DT] = ISNULL(tmp.[END_DT], cmintvlog_.[END_DT]), 
				 [END_DT_SYS] = CASE WHEN tmp.[END_DT] IS NOT NULL AND cmintvlog_.[END_DT_SYS] IS NULL THEN @sNow ELSE cmintvlog_.[END_DT_SYS] END, 
				 [HH_CONT_UID] =tmp.[HH_CONT_UID],-- ISNULL(tmp.[HH_CONT_UID], cmintvlog_.[HH_CONT_UID]), 
				 [ESTB_CONT_UID] =tmp.[ESTB_CONT_UID],-- ISNULL(tmp.[ESTB_CONT_UID], cmintvlog_.[ESTB_CONT_UID]), 
				 [RFS_INTVE_INFO] = ISNULL(tmp.[RFS_INTVE_INFO], cmintvlog_.[RFS_INTVE_INFO]), 
				 [SUBM_DT] = ISNULL(tmp.[SUBM_DT], cmintvlog_.[SUBM_DT]), 
				 [INTV_SESS] = ISNULL(tmp.[INTV_SESS], cmintvlog_.[INTV_SESS]), 
				 [INTV_MDE] = ISNULL(tmp.[INTV_MDE], cmintvlog_.[INTV_MDE]), 
				 [FU_IND] = ISNULL(tmp.[FU_IND], cmintvlog_.[FU_IND]), 
				 [Q_DATA_VER_NO] = ISNULL(tmp.[Q_DATA_VER_NO], cmintvlog_.[Q_DATA_VER_NO]), 
				 [TI_FAIL_RSN_CD] = ISNULL(tmp.[TI_FAIL_RSN_CD], cmintvlog_.[TI_FAIL_RSN_CD]), 
				 [VST_RSLT_CD] = ISNULL(tmp.[VST_RSLT_CD], cmintvlog_.[VST_RSLT_CD]), 
				 [VST_RSLT_RMKS] = ISNULL(tmp.[VST_RSLT_RMKS], cmintvlog_.[VST_RSLT_RMKS]), 
				 [ENUM_RSLT_CD] = ISNULL(tmp.[ENUM_RSLT_CD], cmintvlog_.[ENUM_RSLT_CD]), 
				 [ENUM_RSLT_RMKS] = ISNULL(tmp.[ENUM_RSLT_RMKS], cmintvlog_.[ENUM_RSLT_RMKS]), 
				 [INTV_RMKS] = ISNULL(tmp.[INTV_RMKS], cmintvlog_.[INTV_RMKS]), 
				 [UPD_DT] = @sNow, 
				 [UPD_BY_USR_ID] = ISNULL(@sUserID, cmintvlog_.[UPD_BY_USR_ID]), 
				 [UPD_BY_STF_POSN_UID] = ISNULL(@sStaffPositionUID, cmintvlog_.[UPD_BY_STF_POSN_UID]), 
				 [UPD_SYS_CD] = ISNULL(@sSystemCode, cmintvlog_.[UPD_SYS_CD]), 
				 [VER_NO] = ISNULL(cmintvlog_.[VER_NO], 0) + 1,
				 [INTV_STS] = ISNULL(tmp.[INTV_STS], cmintvlog_.[INTV_STS]) 
			    OUTPUT tmp.INTV_LOG_UID
			    INTO #sResultTable_SetCM_INTV_LOG
            FROM [Census].[CM_INTV_LOG] cmintvlog_ INNER JOIN #sDataSet_SetCM_INTV_LOG tmp ON cmintvlog_.[INTV_LOG_UID] = tmp.[INTV_LOG_UID]
            WHERE tmp.RecordState = 'U'
        END

		
        IF EXISTS (SELECT 1 FROM #sDataSet_SetCM_INTV_LOG WHERE RecordState = 'D') BEGIN
            UPDATE cmintvlog_ SET [INTV_STS] = 'D', UPD_DT = @sNow, [UPD_BY_USR_ID] = ISNULL(@sUserID, cmintvlog_.[UPD_BY_USR_ID]), [UPD_BY_STF_POSN_UID] = ISNULL(@sStaffPositionUID, cmintvlog_.[UPD_BY_STF_POSN_UID]), [VER_NO] = ISNULL(cmintvlog_.[VER_NO], 0) + 1
			    OUTPUT tmp.INTV_LOG_UID
			    INTO #sResultTable_SetCM_INTV_LOG
            FROM [Census].[CM_INTV_LOG] cmintvlog_ INNER JOIN #sDataSet_SetCM_INTV_LOG tmp ON cmintvlog_.[INTV_LOG_UID] = tmp.[INTV_LOG_UID]
            WHERE tmp.RecordState = 'D'
        END

		
        SET @pResultJson = (SELECT [INTV_LOG_UID] FROM #sResultTable_SetCM_INTV_LOG FOR JSON PATH)
        IF @sIsReturnResult = 'Y' BEGIN
            SELECT [INTV_LOG_UID] FROM #sResultTable_SetCM_INTV_LOG 
        END

        IF @sBeginTranCount = 0 AND @@TRANCOUNT > 0 BEGIN
            IF @sTestMode = 1 BEGIN
                ROLLBACK
            END
            ELSE BEGIN
                COMMIT
            END
        END

    END TRY
    BEGIN CATCH
        DECLARE 
            @sErrorNum int,
            @sCatchErrorMessage nvarchar(4000),
            @xstate int,
            @sProcedureName varchar(100),
            @sRtnCodeLog int,
            @sErrMessageLog nvarchar(4000)
        
        SET @sErrorNum = ERROR_NUMBER()
        SET @sCatchErrorMessage = ERROR_MESSAGE()
        SET @xstate = XACT_STATE()
        SET @sProcedureName = OBJECT_NAME(@@PROCID)
	
        IF ISNULL(@pErrCode, 0) = 0 BEGIN
            SET @pErrCode = @sErrorNum
        END
            
        IF @pErrMsg = '' BEGIN
            SET @pErrMsg = @sCatchErrorMessage
        END

        IF @sBeginTranCount = 0 BEGIN
            IF @xstate <> 0 BEGIN
                ROLLBACK
            END

			--ErrorMsg Handling
			SET @pErrMsg = CONCAT('(', @sErrorNum, ') ', @sCatchErrorMessage)

        END
        ELSE
            THROW

    END CATCH
    
    DROP TABLE IF EXISTS #sResultTable_SetCM_INTV_LOG
    DROP TABLE IF EXISTS #BaseJsonDataTable
    DROP TABLE IF EXISTS #sDataSet_SetCM_INTV_LOG
END
